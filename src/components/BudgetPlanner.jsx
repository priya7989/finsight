function BudgetPlanner() {
  const budgets = [
    { category: "Food", budget: 10000, spent: 8000 },
    { category: "Travel", budget: 4000, spent: 5000 },
    { category: "Shopping", budget: 6000, spent: 7000 },
    { category: "Bills", budget: 12000, spent: 10000 },
  ];

  return (
    <section id="budget" className="p-4 md:p-6 scroll-mt-24">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Budget Planner</h2>

      <div className="bg-white rounded-xl shadow-md p-6 h-96 hover:shadow-xl hover:scale-[1.02] transition duration-300">
        {budgets.map((item, index) => {
          const exceeded = item.spent > item.budget;

          return (
            <div
              key={index}
              className="mb-4 border-b pb-4"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">
                  {item.category}
                </h3>

                <span
                  className={
                    exceeded
                      ? "text-red-500"
                      : "text-green-500"
                  }
                >
                  {exceeded ? "Exceeded" : "Safe"}
                </span>
              </div>

              <p>
                Budget: ₹{item.budget} | Spent: ₹{item.spent}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default BudgetPlanner;