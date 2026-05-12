function Navbar() {
  const scrollToSection = (id) => {
    document.getElementById(id).scrollIntoView({
      behavior: "smooth"
    });
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center">

        <h1 className="text-2xl font-bold text-green-600 mb-4 md:mb-0">
          FinSight
        </h1>

        <ul className="flex flex-col md:flex-row gap-3 md:gap-6 text-gray-700 font-medium">
          <li>
            <button onClick={() => scrollToSection("dashboard")}>
              Dashboard
            </button>
          </li>

          <li>
            <button onClick={() => scrollToSection("budget")}>
              Budget
            </button>
          </li>

          <li>
            <button onClick={() => scrollToSection("goals")}>
              Goals
            </button>
          </li>

          <li>
            <button onClick={() => scrollToSection("transactions")}>
              Transactions
            </button>
          </li>
        </ul>

      </div>
    </nav>
  );
}

export default Navbar;