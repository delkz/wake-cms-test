import ListHotsites from "@/components/listHotsites";
import { requireSession } from "@/lib/auth/session";


export default async function Home() {
  await requireSession();

  return (
    <main className="">
      <ListHotsites></ListHotsites>
    </main>
  )

}
