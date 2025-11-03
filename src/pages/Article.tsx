import { ArrowLeft, Bookmark, MoreVertical } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function Article() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <button className="text-white">
              <Bookmark className="w-6 h-6" />
            </button>
            <button className="text-white">
              <MoreVertical className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        <h1 className="text-3xl font-bold text-white leading-tight">
          iPhone 17 Pro Models to Arrive in 2025 With 2nm Chipset Built by TSMC: Report
        </h1>

        <div className="rounded-2xl overflow-hidden bg-muted">
          <img
            src="/placeholder.svg"
            alt="Article"
            className="w-full h-64 object-cover"
          />
        </div>

        <div className="text-white/90 leading-relaxed space-y-4">
          <p>
            Apple is planning to launch the first iPhone equipped with a processor built on a 2nm
            process in 2025, according to a report. The Cupertino company will reportedly launch the
            iPhone 17 Pro and iPhone 17 Pro Max with a next generation chipset from TSMC. The iPhone
            15 Pro models were the first phones from Apple to be equipped with a 3nm A17 Pro chip,
            while the standard iPhone models still run on the 4nm A16 Bionic chipset that previously
            powered the Pro models launched in 2022.
          </p>
        </div>
      </div>
    </div>
  );
}
