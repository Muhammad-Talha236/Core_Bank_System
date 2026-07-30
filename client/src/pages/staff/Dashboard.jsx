    import { useEffect, useState } from 'react';
    import api from '../../api/client';

    export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadStats() {
        try {
            const [customersRes, accountsRes] = await Promise.all([
            api.get('/customers'),
            api.get('/accounts')
            ]);

            const totalBalance = accountsRes.data.reduce((sum, a) => sum + parseFloat(a.Balance), 0);

            setStats({
            totalCustomers: customersRes.data.length,
            totalAccounts: accountsRes.data.length,
            totalBalance
            });
        } catch (err) {
            setError('Could not load dashboard data.');
        }
        }
        loadStats();
    }, []);

    return (
        <div className="p-8">
        <h1 className="font-display text-3xl text-ink-900 mb-1">Dashboard</h1>
        <p className="text-slate-soft mb-8">Overview of your branch's activity.</p>

        {error && <p className="text-ledger-red">{error}</p>}

        {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard label="Total Customers" value={stats.totalCustomers} />
            <StatCard label="Total Accounts" value={stats.totalAccounts} />
            <StatCard
                label="Total Balance"
                value={`Rs ${stats.totalBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
            />
            </div>
        )}
        </div>
    );
    }

    function StatCard({ label, value }) {
    return (
        <div className="bg-white border border-paper-line rounded-sm p-6">
        <p className="font-mono text-xs uppercase tracking-wide text-slate-soft mb-2">{label}</p>
        <p className="font-display text-3xl text-ink-900">{value}</p>
        </div>
    );
    }