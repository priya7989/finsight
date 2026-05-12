import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

function ExpenseChart() {
  const data = [
    { name: "Food", value: 8000 },
    { name: "Travel", value: 5000 },
    { name: "Shopping", value: 7000 },
    { name: "Bills", value: 10000 },
  ];

  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

  return (
    <section className="p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Expense Analytics</h2>

      <div className="bg-white rounded-xl shadow-md p-6 h-96 hover:shadow-xl hover:scale-[1.02] transition duration-300">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              outerRadius={120}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default ExpenseChart;