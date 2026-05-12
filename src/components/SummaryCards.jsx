function SummaryCards() {
  const cards = [
    { title: "Income", amount: "₹50,000" },
    { title: "Expenses", amount: "₹30,000" },
    { title: "Savings", amount: "₹20,000" },
    { title: "Balance", amount: "₹20,000" },
  ];

  return (
    <section id="dashboard" className="p-4 md:p-6 scroll-mt-24">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-xl p-6 hover:shadow-xl hover:scale-105 transition duration-300"
          >
            <h3 className="text-gray-500">{card.title}</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {card.amount}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SummaryCards;