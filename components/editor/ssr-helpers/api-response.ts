import { NextResponse } from "next/server";
import fs from "fs";
import { startRendering } from "./custom-renderer";

interface ApiRequest {
  composition: string;
  inputProps: Record<string, any>;
  outputOptions?: {
    fps?: number;
    width?: number; 
    height?: number;
    durationInFrames?: number;
  };
}

/**
 * Thực thi API để render video và trả về response phù hợp
 * 
 * @param request - Request object từ Next.js API Route
 * @returns NextResponse với thông tin về video đã render hoặc lỗi
 */
export async function executeApi(request: Request): Promise<NextResponse> {
  try {
    // Parse body từ request
    const body: ApiRequest = await request.json();
    
    if (!body.composition || !body.inputProps) {
      return NextResponse.json(
        { error: "Missing required fields: composition and inputProps" },
        { status: 400 }
      );
    }

    // Khởi chạy quá trình render
    const videoPath = await startRendering({
      composition: body.composition,
      inputProps: body.inputProps,
      fps: body.outputOptions?.fps,
      width: body.outputOptions?.width,
      height: body.outputOptions?.height,
      durationInFrames: body.outputOptions?.durationInFrames
    });

    // Đọc file video đã render
    const videoBuffer = fs.readFileSync(videoPath);
    const videoStats = fs.statSync(videoPath);
    
    // Trả về thông tin chi tiết video cho client
    return NextResponse.json({
      success: true,
      videoPath,
      fileSize: videoStats.size,
      downloadUrl: `/api/download?path=${encodeURIComponent(videoPath)}`,
      message: "Video rendered successfully",
    });
  } catch (error) {
    console.error("API execution error:", error);
    return NextResponse.json(
      { error: "Failed to render video", details: (error as Error).message },
      { status: 500 }
    );
  }
}