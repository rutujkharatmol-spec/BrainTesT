"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "./AppContext";

interface FinalScreenProps {
  type?: "cognitive" | "questionnaires";
}

export default function FinalScreen({ type }: FinalScreenProps) {
  const { state } = useAppContext();
  const pathname = usePathname();
  const lang = state.language;

  const isQuestionnaires = type === "questionnaires" || pathname === "/questionnaires";

  const t = (en: string, bn: string, hi: string, mr: string) => {
    if (lang === "bn") return bn;
    if (lang === "hi") return hi;
    if (lang === "mr") return mr;
    return en;
  };

  return (
    <div className="glass-panel card" style={{ maxWidth: 600, margin: "auto", marginTop: "4vh", textAlign: "center", padding: "32px 24px" }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
      <h1 style={{ color: "var(--success-color)", marginBottom: 16, fontSize: 24, fontWeight: 800 }}>
        {isQuestionnaires
          ? t("Surveys Complete!", "সমস্ত প্রশ্নাবলী সম্পন্ন হয়েছে!", "सभी प्रश्नावली पूरी हुईं!", "सर्व प्रश्नावली पूर्ण झाल्या!")
          : t("Battery Complete!", "সমস্ত পরীক্ষা সম্পন্ন হয়েছে!", "सभी परीक्षण पूर्ण हुए!", "सर्व चाचण्या पूर्ण झाल्या!")}
      </h1>
      <p style={{ color: "var(--text-primary)", fontSize: "1rem", lineHeight: 1.6 }}>
        {isQuestionnaires
          ? t(
              "Thank you for taking the time to complete all the questionnaire surveys. Your responses have been successfully recorded.",
              "সমস্ত প্রশ্নাবলী সমীক্ষা সম্পন্ন করার জন্য আপনাকে ধন্যবাদ। আপনার উত্তরগুলি সফলভাবে রেকর্ড করা হয়েছে।",
              "सभी प्रश्नावली सर्वेक्षण पूरा करने के लिए धन्यवाद। आपके उत्तर सफलतापूर्वक दर्ज कर लिए गए हैं।",
              "सर्व प्रश्नावली सर्वेक्षण पूर्ण केल्याबद्दल धन्यवाद. तुमची उत्तरे यशस्वीरित्या नोंदवली गेली आहेत."
            )
          : t(
              "Thank you for taking the time to complete all the cognitive tests. Your results have been successfully recorded.",
              "সমস্ত কগনিটিভ পরীক্ষা সম্পন্ন করার জন্য আপনাকে ধন্যবাদ। আপনার ফলাফল সফলভাবে রেকর্ড করা হয়েছে।",
              "सभी संज्ञानात्मक परीक्षणों को पूरा करने के लिए धन्यवाद। आपके परिणाम सफलतापूर्वक दर्ज कर लिए गए हैं।",
              "सर्व संज्ञानात्मक चाचण्या पूर्ण केल्याबद्दल धन्यवाद. तुमचे निकाल यशस्वीरित्या नोंदवले गेले आहेत."
            )}
      </p>

      {/* Navigation Action Button */}
      <div style={{ marginTop: 24, marginBottom: 8 }}>
        <Link
          href={isQuestionnaires ? "/" : "/questionnaires"}
          style={{ textDecoration: "none" }}
        >
          <button
            className="btn"
            style={{
              padding: "12px 28px",
              fontSize: "1rem",
              fontWeight: 700,
              borderRadius: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
              cursor: "pointer",
            }}
          >
            <span>{isQuestionnaires ? "🧠" : "📋"}</span>
            <span>
              {isQuestionnaires
                ? t("Back to Cognitive Hub", "কগনিটিভ হাবে ফিরে যান", "संज्ञानात्मक हब पर वापस जाएं", "संज्ञानात्मक हबवर परत जा")
                : t("Go to Questionnaires", "প্রশ্নাবলীতে যান", "प्रश्नावली पर जाएं", "प्रश्नावलीकडे जा")}
            </span>
            <span>➔</span>
          </button>
        </Link>
      </div>

      <p style={{ marginTop: 20, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
        {t(
          "You may now close this tab, or click Sign Out below to start over.",
          "আপনি এখন এই ট্যাবটি বন্ধ করতে পারেন, অথবা নতুন করে শুরু করতে নিচে প্রস্থান ক্লিক করতে পারেন।",
          "अब आप इस टैब को बंद कर सकते हैं, या फिर से शुरू करने के लिए नीचे साइन आउट पर क्लिक कर सकते हैं।",
          "तुम्ही आता हा टॅब बंद करू शकता, किंवा पुन्हा सुरू करण्यासाठी खाली बाहेर पडा (Sign Out) वर क्लिक करू शकता."
        )}
      </p>
    </div>
  );
}
