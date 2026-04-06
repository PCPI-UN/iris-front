// Redirect page for the contributors section, guiding users to the main developers page.
import { redirect } from 'next/navigation'; 

export default function ContributorsPage() {
  redirect('/public/developers');
}
