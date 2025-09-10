import cv2
import numpy as np
from PIL import Image, ImageDraw
import math
import base64
from io import BytesIO


def rotate_point(point, center, angle_rad):
    """ 旋转单个点 """
    x, y = point
    cx, cy = center
    cos_a, sin_a = math.cos(angle_rad), math.sin(angle_rad)
    new_x = cx + (x - cx) * cos_a - (y - cy) * sin_a
    new_y = cy + (x - cx) * sin_a + (y - cy) * cos_a
    return new_x, new_y


def rotate_image(image_base64, epsilon_factor=0.01, line_width=2, save_image=False,
                                    output_path=None):
    # 解码 Base64 为图像
    global rotation_dimension
    image_data = base64.b64decode(image_base64)
    img = Image.open(BytesIO(image_data)).convert("RGBA")

    # 获取 Alpha 透明通道
    alpha = img.getchannel("A")

    # 创建黑白图像：透明部分变为白色（255），不透明部分变为黑色（0）
    bw = alpha.point(lambda a: 255 if a == 0 else 0)

    # 转换为 NumPy 数组（OpenCV 处理）
    bw_np = np.array(bw)

    # **反转颜色，使黑色变为前景 (255)，白色变为背景 (0)**
    bw_np = 255 - bw_np

    # 轮廓检测（检测黑色区域的真实轮廓）
    contours, _ = cv2.findContours(bw_np, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 创建新图像，仅绘制最长的线段
    new_img = Image.new("RGBA", img.size, "white")
    draw = ImageDraw.Draw(new_img)

    longest_line = None
    max_length = 0

    # 找出最长线段
    for cnt in contours:
        epsilon = epsilon_factor * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        points = [(p[0][0], p[0][1]) for p in approx]

        for i in range(len(points)):
            p1, p2 = points[i], points[(i + 1) % len(points)]
            length = math.dist(p1, p2)
            if length > max_length:
                max_length = length
                longest_line = (p1, p2)

    if longest_line:
        (x1, y1), (x2, y2) = longest_line
        center_x, center_y = (x1 + x2) / 2, (y1 + y2) / 2
        angle_rad = -math.atan2(y2 - y1, x2 - x1)
        angle_deg = math.degrees(angle_rad)

        # 计算旋转维度（顺时针，每 30 度为一个单位）
        rotation_dimension = round(angle_deg / 30) * 30

        # 旋转线段使其水平
        p1_rot = rotate_point((x1, y1), (center_x, center_y), angle_rad)
        p2_rot = rotate_point((x2, y2), (center_x, center_y), angle_rad)

        draw.line([p1_rot, p2_rot], fill="black", width=line_width)

    # 保存最终结果（如果需要）
    if save_image and output_path:
        new_img.save(output_path)

    return rotation_dimension