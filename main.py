import argparse
from contextlib import AsyncExitStack, suppress
import asyncio
import traceback
import inspect
from loguru import logger
from py_app.config.config import settings
from py_app.register import launcher
from py_app.exception.error import StopException, NoTaskException
from py_app.load_module import load_modules_from_directory


async def force_async_call(func):
    """
    强制异步调用：无论 func 是协程函数、协程对象，还是同步函数，
    都在线程中运行，避免阻塞主事件循环。
    """
    if inspect.iscoroutinefunction(func):
        def runner():
            asyncio.run(func())
        return await asyncio.to_thread(runner)
    elif inspect.iscoroutine(func):
        def runner():
            asyncio.run(func)
        return await asyncio.to_thread(runner)
    else:
        return await asyncio.to_thread(func)


async def run(project: str, task_id: int, timeout: int = 1800, sleep: int = 10, arg=''):
    print(launcher)
    """持续运行的任务执行函数"""
    svc = launcher.get(project)
    if not svc:
        logger.error(f"项目 {project} 不存在")
        exit(1)

    await asyncio.sleep(task_id * 3)  # 错峰启动
    logger.info(f"任务{task_id}: 项目 {project} 开始执行")

    while True:  # 无限循环，持续运行
        async with AsyncExitStack() as stack:
            sc = None
            try:
                sc = svc(arg)
                await stack.enter_async_context(sc)  # 注册到退出栈

                # 设置超时时间并执行任务（兼容阻塞函数）
                await asyncio.wait_for(force_async_call(sc.run), timeout=timeout)
                logger.success(f"任务{task_id}: 项目 {project} 单次任务完成")
                await sc.stop()
            except asyncio.TimeoutError:
                logger.error(f"任务{task_id}: 项目 {project} 任务超时")
                await sc.stop()
            except StopException:
                logger.error(f"任务{task_id}: 项目 {project} 收到停止信号，终止任务")
                return  # 收到停止信号则完全退出任务
            except NoTaskException:
                logger.warning(f"任务{task_id}: 项目 {project} 暂无可执行任务")
                await asyncio.sleep(10)
            except Exception as e:
                logger.error(f"任务{task_id}: 项目 {project} 发生异常: {str(e)}")
                await sc.stop()
                traceback.print_exc()
            finally:
                if sc is not None and not hasattr(sc, '__aexit__'):
                    # 如果sc不是异步上下文，手动清理
                    with suppress(Exception):
                        if asyncio.iscoroutinefunction(sc.stop):
                            await sc.stop()
                        else:
                            await sc.stop()

            # 每次执行后休眠指定时间
            logger.info(f"任务{task_id}: 等待 {sleep} 秒后继续...")
            await asyncio.sleep(sleep)


async def main():
    """主函数，负责参数解析和任务调度"""
    parser = argparse.ArgumentParser(description="持续任务执行器")
    parser.add_argument("-n", "--name", type=str, help="项目名称", required=True)
    parser.add_argument("-t", "--timeout", type=int,
                        help="单次任务超时时间(秒)", default=2100)
    parser.add_argument("-s", "--sleep", type=int,
                        help="每次执行后休眠时间(秒)", default=2)
    parser.add_argument("-g", "--thread_num", type=int,
                        help="并发任务数量", default=settings.APP.thread_num)
    parser.add_argument("-a", "--arg", type=str, help="额外参数", default='')
    args = parser.parse_args()

    if not args.name:
        logger.error("请输入要执行的项目")
        return

    logger.info(f"启动持续任务执行: 项目 {args.name}, 并发数 {args.thread_num}")
    logger.info(f"单次任务超时: {args.timeout}秒, 执行间隔: {args.sleep}秒")

    try:
        tasks = [
            asyncio.create_task(
                run(args.name, i, args.timeout, args.sleep, args.arg)
            )
            for i in range(args.thread_num)
        ]

        await asyncio.gather(*tasks)

    except Exception as e:
        logger.error(f"主程序发生异常: {str(e)}")
        traceback.print_exc()
    except KeyboardInterrupt:
        logger.info("收到中断信号，正在停止所有任务...")
    finally:
        logger.info("程序退出")

if __name__ == "__main__":
    load_modules_from_directory("py_app/services")
    asyncio.run(main())
