// dev stub — รอบนี้ยังไม่ต่อ auth จริง
// ทุก query ราย user ต้องกรองผ่าน getCurrentUser() เพื่อความสม่ำเสมอ
// id = uuid ของ dev user ที่ seed ไว้ (src/db/seed.ts) เพื่อให้ query DB จริงได้
// ต่อ DB/auth จริงค่อยมาแทน internals ที่นี่

export type CurrentUser = {
  id: string;
  role: "admin" | "user";
};

export async function getCurrentUser(): Promise<CurrentUser> {
  return { id: "00000000-0000-0000-0000-000000000001", role: "user" };
}
