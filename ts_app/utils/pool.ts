import genericPool from 'generic-pool'
import { sleep } from './help';
import { Observable, Subject, mergeMap } from 'rxjs';


export class TaskPool<T> {

    private taskPool: genericPool.Pool<T>


    constructor(
        private opts: genericPool.Options = {
            max: 3, // 池的最大大小
            min: 1 // 池的最小大小
        },
        private factory: genericPool.Factory<T>
    ) {
        this.taskPool = genericPool.createPool(factory, opts);
    }

    async start(fn: ((rs: T) => Promise<void>)[]) {
        this.taskPool.start()

        const taskPool = this.taskPool

        while (true) {

            if (taskPool.size >= taskPool.getMaxListeners()) {
                console.log(taskPool.size, "连接池已满，需要等待执行")
                continue
            }

            taskPool.acquire().then(async (rs): Promise<void> => {
                try {
                    for (let f of fn) {
                        await f(rs)
                    }
                } catch (error) {
                    console.log("任务执行失败", error)
                }
                console.log(taskPool.getMaxListeners(), taskPool.size, "连接池大小")
                try {
                    await taskPool.release(rs)
                } catch (error) { }

            })
            await sleep(10000)
        }
    }
}


class LimitedQueue<T> {
    private queue: Subject<(r: T) => Promise<void>>;
    private results: Observable<any>;
    constructor(max: number = 3, private fac: T) {
        this.queue = new Subject();
        this.results = this.queue.pipe(mergeMap((task) => this.processTask(task), max));
    }

    processTask(task: (r: T) => Promise<void>) {
        return new Observable((observer) => {
            task(this.fac).then(rs => {
                const s = getRandomDelay()
                sleep(s).then(() => {
                    observer.complete();
                    this.enqueue(task);
                })

            })
        });
    }

    enqueue(task: (r: T) => Promise<void>) {
        this.queue.next(task);
    }

    start() {
        this.results.subscribe()
    }
}


export async function StartPool<T>(max: number = 3, fac: () => Promise<T>, fn: (rs: T) => Promise<void>) {
    const f = await fac()
    const queue = new LimitedQueue(max, f);
    queue.start();
    for (let i = 0; i < max; i++) {
        queue.enqueue(fn)
    }
}

// 生成一个5到15之间的随机数
function getRandomDelay() {
    return Math.floor(Math.random() * 11) + 5;
}
