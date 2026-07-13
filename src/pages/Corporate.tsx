import LegalPage from "@/components/LegalPage";
const sections = [
  { heading: "Company Details", bullets: [
    "Legal Name: NowAnime Inc.",
    "Type: Corporation",
    "Jurisdiction: Delaware, USA",
    "Registered Agent: Corporation Service Company, 251 Little Falls Drive, Wilmington, DE 19808",
    "Corporate Address: 811 Grand St, Alameda, CA 94501, USA",
  ]},
  { heading: "Service Provider Information", paragraphs: ["NowAnime Inc. is the service provider for the NowAnime streaming platform. We are committed to delivering a high-quality, reliable, and legal streaming experience."] },
  { heading: "Data Controller", paragraphs: ["For data protection and privacy matters, NowAnime Inc. acts as the data controller for personal information collected through the NowAnime service."] },
  { heading: "Contact Information", bullets: [
    "General Inquiries: hello.nowanime@gmail.com",
    "Legal Notices: legal@nowanime.com",
    "Privacy Matters: privacy@nowanime.com",
    "DMCA Notices: dmca@nowanime.com",
  ]},
  { heading: "Operating Status", paragraphs: ["NowAnime is fully operational and committed to providing free entertainment to users worldwide."] },
];
export default function Corporate() {
  return <LegalPage title="Corporate Information" description="Official company information, legal entity, registered office and contacts." intro="NowAnime is a digital entertainment platform dedicated to providing free, ad-supported streaming content to audiences worldwide." sections={sections} />;
}
