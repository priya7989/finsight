import Navbar from "./components/Navbar";
import SummaryCards from "./components/SummaryCards";
import ExpenseChart from "./components/ExpenseChart";
import BudgetPlanner from "./components/BudgetPlanner";
import GoalTracker from "./components/GoalTracker";
import TransactionList from "./components/TransactionList";
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-200 via cyan-200 to-blue-200">
      <Navbar />
      <SummaryCards />
      <ExpenseChart />
      <BudgetPlanner />
      <GoalTracker />
      <TransactionList />
    </div>
  );
}
<footer className="text-center p-4 text-gray-500">
  © 2026 FinSight
</footer>
export default App;