/*
 * @Description: 海报生成工具函数
 * @Author: 安知鱼
 * @Date: 2025-01-XX
 */

/**
 * 海报生成配置
 */
export interface PosterConfig {
  title: string; // 文章标题
  description?: string; // 文章简介
  author: string; // 作者名称
  authorAvatar?: string; // 作者头像URL
  siteName?: string; // 站点名称
  siteSubtitle?: string; // 站点副标题
  articleUrl: string; // 文章URL
  coverImage?: string; // 文章封面图
  publishDate?: string; // 文章发布时间
}

/**
 * 加载图片
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * 绘制圆形头像
 */
function drawCircleAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  image: HTMLImageElement
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

/**
 * 文字换行处理
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines?: number // 可选：最大行数限制
): number {
  const words = text.split("");
  let line = "";
  let currentY = y;
  let lineCount = 1;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      lineCount++;
      // 如果设置了最大行数限制，且已达到限制，则截断剩余文本
      if (maxLines && lineCount >= maxLines) {
        // 在最后一行添加省略号
        let lastLine = line;
        while (
          ctx.measureText(lastLine + "...").width > maxWidth &&
          lastLine.length > 0
        ) {
          lastLine = lastLine.slice(0, -1);
        }
        ctx.fillText(lastLine + "...", x, currentY + lineHeight);
        return currentY + lineHeight;
      }
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  // 绘制最后一行
  if (line.length > 0) {
    ctx.fillText(line, x, currentY);
  }
  return currentY;
}

/**
 * 生成文章分享海报
 */
export async function generatePoster(config: PosterConfig): Promise<string> {
  // 动态导入 qrcode 库
  const QRCode = (await import("qrcode")).default;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("无法创建 Canvas 上下文");
  }

  // 海报尺寸（竖版，适合手机分享）
  const width = 750;
  const height = 1000; // 降低整体高度，使布局更紧凑（从1334px降低到1000px）
  canvas.width = width;
  canvas.height = height;

  // 背景色（根据主题色调整）
  const bgColor = "#ffffff";
  const primaryColor = "#3b82f6";
  const textColor = "#1f2937";
  const secondaryTextColor = "#6b7280";

  // 绘制背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // 绘制封面图（如果有）- 保持宽高比，使用裁剪而不是拉伸
  let coverY = 0;
  const coverHeight = 420;
  if (config.coverImage) {
    try {
      const coverImg = await loadImage(config.coverImage);
      const coverWidth = width;

      // 计算图片的宽高比
      const imgAspectRatio = coverImg.width / coverImg.height;
      const targetAspectRatio = coverWidth / coverHeight;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = coverImg.width;
      let sourceHeight = coverImg.height;

      // 如果图片比目标区域宽，需要裁剪宽度（保持高度）
      if (imgAspectRatio > targetAspectRatio) {
        sourceWidth = coverImg.height * targetAspectRatio;
        sourceX = (coverImg.width - sourceWidth) / 2; // 居中裁剪
      } else {
        // 如果图片比目标区域高，需要裁剪高度（保持宽度）
        sourceHeight = coverImg.width / targetAspectRatio;
        sourceY = (coverImg.height - sourceHeight) / 2; // 居中裁剪
      }

      // 绘制封面图（使用裁剪，保持宽高比）
      ctx.drawImage(
        coverImg,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight, // 源图片区域
        0,
        coverY,
        coverWidth,
        coverHeight // 目标区域（固定高度）
      );
      coverY += coverHeight;
    } catch (error) {
      console.warn("封面图加载失败，跳过:", error);
      // 如果封面图加载失败，使用简洁的渐变背景作为降级方案
      const defaultCoverHeight = 80; // 大幅降低高度，使布局更紧凑
      const gradient = ctx.createLinearGradient(
        0,
        0,
        width,
        defaultCoverHeight
      );
      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(1, "#60a5fa");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, defaultCoverHeight);
      coverY = defaultCoverHeight;
    }
  } else {
    // 没有封面图时，使用简洁的渐变背景（降低高度，使布局更紧凑）
    const defaultCoverHeight = 80; // 大幅降低高度
    const gradient = ctx.createLinearGradient(0, 0, width, defaultCoverHeight);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, "#60a5fa");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, defaultCoverHeight);
    coverY = defaultCoverHeight;
  }

  // 绘制内容区域背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, coverY, width, height - coverY);

  // 绘制标题（增大字体）
  ctx.fillStyle = textColor;
  ctx.font =
    "bold 48px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const padding = 40;
  const titleX = padding;
  let titleY = coverY + 40; // 增加顶部间距
  const titleMaxWidth = width - padding * 2;

  // 标题换行（增大行高）
  const titleLineHeight = 58;
  titleY =
    wrapText(
      ctx,
      config.title,
      titleX,
      titleY,
      titleMaxWidth,
      titleLineHeight
    ) + 20;

  // 绘制文章简介（如果有）- 增大字体
  let descY = titleY;
  // 提前定义底部装饰线位置，用于计算描述的最大行数
  const lineY = height - 200;

  if (config.description) {
    // 增加间距，让描述距离标题更远（从30改为50）
    descY += 50;
    ctx.fillStyle = secondaryTextColor;
    ctx.font = "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    const lineHeight = 38;
    const descMaxWidth = titleMaxWidth;
    const descText = config.description;

    // 计算可用空间：从描述开始位置到底部装饰线的距离
    const availableHeight = lineY - descY - 50; // 留50px安全边距
    // 根据可用空间动态计算最大行数
    const maxDescLines = Math.max(1, Math.floor(availableHeight / lineHeight));

    // 绘制简介文本（支持换行，动态计算最大行数）
    const finalDescY = wrapText(
      ctx,
      descText,
      titleX,
      descY,
      descMaxWidth,
      lineHeight,
      maxDescLines
    );
    descY = finalDescY + 16;
  }

  // 绘制底部装饰线（lineY 已在前面定义）
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, lineY);
  ctx.lineTo(width - padding, lineY);
  ctx.stroke();

  // 底部区域布局：水平居中
  const qrCodeSize = 120;
  const bottomAvatarSize = 50;
  const bottomTextSpacing = 14; // 头像和文字间距
  const bottomSectionSpacing = 40; // 左侧区域和二维码间距

  // 估算左侧文字区域宽度（站点名称+副标题）
  ctx.font =
    "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const siteNameWidth = ctx.measureText(config.siteName || config.author).width;
  ctx.font = "18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const subtitleWidth = config.siteSubtitle
    ? ctx.measureText(config.siteSubtitle).width
    : 0;
  const leftTextWidth = Math.max(siteNameWidth, subtitleWidth);

  // 计算整个底部区域的宽度
  const bottomSectionWidth =
    bottomAvatarSize +
    bottomTextSpacing +
    leftTextWidth +
    bottomSectionSpacing +
    qrCodeSize;

  // 计算居中起始位置
  const bottomSectionStartX = (width - bottomSectionWidth) / 2;
  // 调整：二维码上移（从 lineY + 40 改为 lineY + 20）
  const qrCodeY = lineY + 20;

  // 左侧：头像 + 站点名称 + 站点副标题
  const bottomAvatarX = bottomSectionStartX;
  // 调整：头像下移（从 lineY + 35 改为 lineY + 45）并与二维码垂直居中
  // 二维码高度120px，头像高度50px，为了垂直居中：avatarY = qrCodeY + (120-50)/2 = qrCodeY + 35
  // 用户要求：头像再往下调整一点点（增加8px），但文字位置保持不变
  // 再次调整：头像再往下移动一点点（再增加5px）
  const baseAvatarY = qrCodeY + (qrCodeSize - bottomAvatarSize) / 2;
  const bottomAvatarY = baseAvatarY + 13; // 头像下移13px（从8px增加到13px）

  // 二维码位置
  const qrCodeX =
    bottomSectionStartX +
    bottomAvatarSize +
    bottomTextSpacing +
    leftTextWidth +
    bottomSectionSpacing;

  // 绘制头像
  if (config.authorAvatar) {
    try {
      const avatarImg = await loadImage(config.authorAvatar);
      drawCircleAvatar(
        ctx,
        bottomAvatarX + bottomAvatarSize / 2,
        bottomAvatarY + bottomAvatarSize / 2,
        bottomAvatarSize / 2,
        avatarImg
      );
    } catch (error) {
      console.warn("头像加载失败，使用默认样式:", error);
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(
        bottomAvatarX + bottomAvatarSize / 2,
        bottomAvatarY + bottomAvatarSize / 2,
        bottomAvatarSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // 绘制站点名称和副标题（保持原位置，不随头像下移）
  const bottomTextX = bottomAvatarX + bottomAvatarSize + bottomTextSpacing;
  // 使用原来的头像中心位置计算文字位置（基于 baseAvatarY，而不是调整后的 bottomAvatarY）
  const originalAvatarCenterY = baseAvatarY + bottomAvatarSize / 2;
  // 调整文字位置使其与原来的头像位置垂直居中
  // 站点名称（26px字体）和副标题（18px字体）两行文字，增加行间距
  const siteNameY = originalAvatarCenterY - 6; // 站点名称稍微偏上
  const subtitleY = originalAvatarCenterY + 28; // 副标题下移，增加与站点名称的间距（从20改为28）

  ctx.fillStyle = textColor;
  ctx.font =
    "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(config.siteName || config.author, bottomTextX, siteNameY);

  // 绘制站点副标题（小字）
  if (config.siteSubtitle) {
    ctx.fillStyle = secondaryTextColor;
    ctx.font = "18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(config.siteSubtitle, bottomTextX, subtitleY);
  }

  // 右侧：生成二维码
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(config.articleUrl, {
      width: qrCodeSize,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });

    const qrImg = await loadImage(qrCodeDataUrl);
    ctx.drawImage(qrImg, qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
  } catch (error) {
    console.error("生成二维码失败:", error);
    throw new Error("生成二维码失败");
  }

  // 二维码下方提示文字（调整：从 +18 改为 +12，让文字更靠近二维码）
  ctx.fillStyle = secondaryTextColor;
  ctx.font = "18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  const qrTextY = qrCodeY + qrCodeSize + 12;
  ctx.fillText("扫码查看文章", qrCodeX + qrCodeSize / 2, qrTextY);

  return canvas.toDataURL("image/png", 1.0);
}

/**
 * 下载海报
 */
export function downloadPoster(
  dataUrl: string,
  filename: string = "poster.png"
) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
