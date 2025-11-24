import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 登出 API
 *
 * 清除 httpOnly cookie 中的 JWT token
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    // 刪除 token cookie
    cookieStore.delete("token");

    return NextResponse.json({ success: true, message: "登出成功" });
  } catch (error) {
    console.error("登出失敗:", error);
    return NextResponse.json(
      { success: false, message: "登出失敗" },
      { status: 500 }
    );
  }
}
