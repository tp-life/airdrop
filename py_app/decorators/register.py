from py_app.register import launcher


def register(*aliases):
    """
    支持别名注册的装饰器。
    """
    def decorator(cls):
        print(register, "DD")
        for alias in aliases:
            if not alias:
                continue
            launcher[alias] = cls
        launcher[cls.__name__.lower()] = cls  # 默认使用类名注册
        return cls

    return decorator
