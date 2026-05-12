function TransactionList() {
  const transactions = [
    {
      title: "Grocery",
      amount: 2500,
      date: "11 May 2026",
    },
    {
      title: "Electricity Bill",
      amount: 1800,
      date: "10 May 2026",
    },
    {
      title: "Travel",
      amount: 1200,
      date: "9 May 2026",
    },
  ];

  return (
    <section id="transactions" className="p-4 md:p-6 scroll-mt-24">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">
        Recent Transactions
      </h2>

      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition duration-300">
        {transactions.map((item, index) => (
          <div
            key={index}
            className="flex justify-between border-b py-4"
          >
            <div>
              <h3 className="font-semibold">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500">
                {item.date}
              </p>
            </div>

            <p className="text-red-500 font-bold">
              -₹{item.amount}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TransactionList;