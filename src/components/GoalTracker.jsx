function GoalTracker() {
  const target = 80000;
  const saved = 30000;

  const progress = (saved / target) * 100;

  return (
    <section id="goals" className="p-4 md:p-6 scroll-mt-24">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">
        Savings Goal
      </h2>

      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition duration-300">
        <h3 className="text-xl font-semibold">
          Buy Laptop
        </h3>

        <p className="mt-2">
          Target: ₹{target}
        </p>

        <p>
          Saved: ₹{saved}
        </p>

        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="mt-2 text-green-600 font-bold">
          {progress.toFixed(0)}%
        </p>
      </div>
    </section>
  );
}

export default GoalTracker;