const STATS = [
  { label: "누적 상담 건수", value: "3,800+", suffix: "" },
  { label: "등록 학원 정보", value: "500+", suffix: "곳" },
  { label: "무료 학원 매칭", value: "100", suffix: "%" },
  { label: "수강생 만족도", value: "97", suffix: "%" },
];

export default function StatsSection() {
  return (
    <section className="bg-dark text-white py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center animate-count">
              <p className="text-3xl lg:text-4xl font-black text-orange mb-2">
                {stat.value}
                {stat.suffix && (
                  <span className="text-lg lg:text-xl text-white/80">{stat.suffix}</span>
                )}
              </p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
