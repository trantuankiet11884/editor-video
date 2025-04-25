import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "fs";
import os from "os";
import path from "path";

interface RenderOptions {
  composition: string;
  inputProps: Record<string, any>;
  outputFilePath?: string;
  fps?: number;
  width?: number;
  height?: number;
  durationInFrames?: number;
}

/**
 * Bắt đầu quá trình render video sử dụng Remotion
 * 
 * @param options - Cấu hình cho quá trình render
 * @returns Promise chứa đường dẫn tới file video đã render
 */
export async function startRendering({
  composition,
  inputProps,
  outputFilePath,
  fps = 30,
  width = 1920,
  height = 1080,
  durationInFrames = 30
}: RenderOptions): Promise<string> {
  // Tạo thư mục tạm để lưu trữ video
  const tempDir = path.join(os.tmpdir(), 'video-renders');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Tạo tên file output nếu không được cung cấp
  const outputFile = outputFilePath || path.join(
    tempDir,
    `render-${Date.now()}.mp4`
  );

  try {
    // Đóng gói mã nguồn Remotion
    console.log('Bundling video...');
    const bundleResult = await bundle({
      entryPoint: path.join(process.cwd(), 'components/editor/remotion/index.ts'),
      // Có thể sử dụng webpackOverride để tùy chỉnh cấu hình webpack
    });

    // Chọn composition để render từ bundle
    console.log('Selecting composition...');
    const selectedComposition = await selectComposition({
      serveUrl: bundleResult,
      id: composition,
      inputProps,
    });

    // Render video
    console.log('Starting rendering...');
    await renderMedia({
      composition: selectedComposition  ,
      serveUrl: bundleResult,
      codec: 'h264',
      outputLocation: outputFile,
      inputProps,
      imageFormat: 'jpeg',
      fps: selectedComposition.fps,
      width: width || selectedComposition.width,
      height: height || selectedComposition.height,
      durationInFrames: durationInFrames || selectedComposition.durationInFrames,
    });

    console.log('Render complete:', outputFile);
    return outputFile;
  } catch (error) {
    console.error('Rendering failed:', error);
    throw error;
  }
}