"use client";

import { useAppContext } from "./AppContext";

export default function FinalScreen() {
  const { state } = useAppContext();
  const lang = state.language;

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
        {t("Battery Complete!", "সমস্ত পরীক্ষা সম্পন্ন হয়েছে!", "सभी परीक्षण पूर्ण हुए!", "सर्व चाचण्या पूर्ण झाल्या!")}
      </h1>
      <p style={{ color: "var(--text-primary)", fontSize: "1rem", lineHeight: 1.6 }}>
        {t(
          "Thank you for taking the time to complete all the cognitive tests. Your results have been successfully recorded.",
          "সমস্ত কগনিটিভ পরীক্ষা সম্পন্ন করার জন্য আপনাকে ধন্যবাদ। আপনার ফলাফল সফলভাবে রেকর্ড করা হয়েছে।",
          "सभी संज्ञानात्मक परीक्षणों को पूरा करने के लिए धन्यवाद। आपके परिणाम सफलतापूर्वक दर्ज कर लिए गए हैं।",
          "सर्व संज्ञानात्मक चाचण्या पूर्ण केल्याबद्दल धन्यवाद. तुमचे निकाल यशस्वीरित्या नोंदवले गेले आहेत."
        )}
      </p>
      <p style={{ marginTop: 24, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
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
