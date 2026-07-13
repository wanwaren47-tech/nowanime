import LegalPage from "@/components/LegalPage";
const sections = [
  { heading: "General Inquiries", paragraphs: ["Email: hello.nowanime@gmail.com — we aim to respond within 24-48 hours."] },
  { heading: "Support", paragraphs: ["Browse the Help Center first, or email support@nowanime.com."] },
  { heading: "Legal & DMCA", bullets: ["Legal notices: legal@nowanime.com", "DMCA takedown requests: dmca@nowanime.com"] },
  { heading: "Privacy", paragraphs: ["Privacy questions: privacy@nowanime.com"] },
  { heading: "Partnerships & Press", bullets: ["Media inquiries: press@nowanime.com", "Partnerships: partners@nowanime.com"] },
  { heading: "Advertising", paragraphs: ["Email partners@nowanime.com to advertise with us."] },
];
export default function Contact() {
  return <LegalPage title="Contact Us" description="Reach out to NowAnime for support, feedback, partnerships or press." intro="We'd love to hear from you. Whether you have a question, feedback, or a concern, we're here to help." sections={sections} cta={{ label: "Email hello.nowanime@gmail.com", href: "mailto:hello.nowanime@gmail.com" }} />;
}
