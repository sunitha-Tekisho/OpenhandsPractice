import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  });
  const { getToken } = useAuth();

  const fetchExpenses = useCallback(async () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    try {
      const res = await fetch(`/api/expenses?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setAdding(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(newExpense)
      });

      if (res.ok) {
        setNewExpense({
          title: '',
          amount: '',
          category: 'Food',
          date: new Date().toISOString().split('T')[0]
        });
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">Expenses</h1>
        <p className="text-text-secondary">
          Track your spending this month
        </p>
      </div>

      {/* Add Expense Form */}
      <form
        onSubmit={handleAddExpense}
        className="bg-surface rounded-lg p-4 md:p-6 mb-8 fade-in"
      >
        <h2 className="text-lg font-semibold mb-4">Add New Expense</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={newExpense.title}
              onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
              required
              placeholder="Expense title"
              className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <input
              type="number"
              step="0.01"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              required
              placeholder="0.00"
              className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              required
              className="flex-1 px-4 py-3 bg-surface-elevated border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={adding}
              className="px-6 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 rounded-md font-medium transition-colors whitespace-nowrap"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      </form>

      {/* Monthly Total */}
      <div className="bg-surface rounded-lg p-4 md:p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-text-secondary text-sm mb-1">This Month Total</p>
            <p className="text-2xl md:text-3xl font-semibold text-accent">
              {formatAmount(total)}
            </p>
          </div>
          <div className="text-text-secondary text-sm">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-text-secondary">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No expenses this month. Add your first expense above!
          </div>
        ) : (
          expenses.map(expense => (
            <div
              key={expense.id}
              className="bg-surface rounded-lg p-4 flex items-center justify-between gap-4 fade-in hover:bg-surface-elevated transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{expense.title}</h3>
                <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                  <span className="px-2 py-0.5 bg-surface-elevated rounded text-xs">
                    {expense.category}
                  </span>
                  <span>{formatDate(expense.date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold text-accent whitespace-nowrap">
                  {formatAmount(expense.amount)}
                </p>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}