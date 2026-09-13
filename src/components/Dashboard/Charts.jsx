import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Doughnut, Line, Radar } from 'react-chartjs-2';
import { formatBRL } from '../../utils/formatters';

// Registra os elementos do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

// Cores premium usadas no AgentFinanceiro
const PRESET_COLORS = [
  '#4cc9f0', '#3a0ca3', '#f72585', '#00f5d4', '#fca311', '#8338ec', '#ff006e'
];

export default function Charts({ charts }) {
  if (!charts) return null;

  const { donut, line, radar } = charts;

  // Options Donut
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#e9ecef', font: { family: 'Poppins' } } },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${formatBRL(context.raw)}`
        }
      }
    },
    cutout: '75%',
    borderWidth: 0
  };

  const donutData = {
    labels: donut?.labels || [],
    datasets: [{
      data: donut?.series || [],
      backgroundColor: PRESET_COLORS,
      hoverOffset: 10,
      borderWidth: 0
    }]
  };

  // Options Line (Projeção 12 meses)
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Saldo Livre Projetado: ${formatBRL(context.raw)}`
        }
      }
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#adb5bd' } },
      x: { grid: { display: false }, ticks: { color: '#adb5bd' } }
    },
    elements: {
      line: { tension: 0.4 } // Suavização da linha
    }
  };

  const lineData = {
    labels: line?.labels || [],
    datasets: [{
      label: 'Saldo Livre Projetado',
      data: line?.series || [],
      borderColor: '#4cc9f0',
      backgroundColor: 'rgba(76, 201, 240, 0.1)',
      borderWidth: 3,
      fill: true,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#4cc9f0',
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  // Options Radar
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      r: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#e9ecef', font: { size: 11, family: 'Poppins' } },
        ticks: { display: false }
      }
    }
  };

  const radarData = {
    labels: radar?.labels || [],
    datasets: [{
      label: 'Intensidade de Gastos',
      data: radar?.series || [],
      backgroundColor: 'rgba(181, 23, 158, 0.2)',
      borderColor: '#b5179e',
      pointBackgroundColor: '#b5179e',
      pointBorderColor: '#fff',
      borderWidth: 2,
    }]
  };

  return (
    <div className="dashboard-grid" style={{ marginTop: '1.8rem', gridTemplateColumns: 'repeat(6, 1fr)' }}>
      {/* Donut Chart */}
      <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Gastos do mês</h3>
        <div style={{ flex: 1, minHeight: '250px', position: 'relative' }}>
          {donut?.series?.length > 0 ? (
            <Doughnut data={donutData} options={donutOptions} />
          ) : (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)' }}>
              Sem gastos registrados.
            </div>
          )}
        </div>
      </div>

      {/* Line Chart */}
      <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Projeção 12 Meses (Livre)</h3>
        <div style={{ flex: 1, minHeight: '250px' }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Radar Chart */}
      <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Categorias do mês</h3>
        <div style={{ flex: 1, minHeight: '250px' }}>
           {radar?.series?.length > 0 ? (
            <Radar data={radarData} options={radarOptions} />
           ) : (
             <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
               Sem dados.
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
