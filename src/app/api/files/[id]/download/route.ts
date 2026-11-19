import { NextRequest } from "next/server";
import { handleFileRequest } from "@/lib/server/file-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleFileRequest(request, id, { disposition: "attachment" });
}
