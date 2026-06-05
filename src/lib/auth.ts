// dev stub — รอบนี้ยังไม่ต่อ auth จริง
// ทุก query ราย user ต้องกรองผ่าน getCurrentUser() เพื่อความสม่ำเสมอ
// ต่อ DB/auth จริงค่อยมาแทน internals ที่นี่

export type CurrentUser = {
  id: string;
  role: "admin" | "user";
};

export async function getCurrentUser(): Promise<CurrentUser> {
  // TODO: แทนด้วย Supabase auth + lookup role จาก users table
  return { id: "dev-01", role: "user" };
}
