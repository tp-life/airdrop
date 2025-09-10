import importlib
import pkgutil
import os


def load_modules_from_directory(raw_dir):
    """
    动态加载指定目录下的所有模块。
    """
    # 获取目录的绝对路径
    directory = os.path.abspath(raw_dir)
    # 获取目录的包名（假设目录是一个包）
    package_name = raw_dir.replace('/', '.')
    print(package_name, directory, "package_name")

    # 遍历目录下的所有文件
    for _, module_name, _ in pkgutil.iter_modules([directory]):
        # 动态导入模块
        importlib.import_module(f"{package_name}.{module_name}")
