import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const axis = { stroke: '#94a3b8', fontSize: 12 };
const tip = { contentStyle: { borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 } };
const Box = ({ title, children, empty }) => (
  <div className="card"><h3 className="mb-3 text-sm font-semibold">{title}</h3>
    {empty ? <p className="py-10 text-center text-sm text-slate-500">Not enough data yet</p> : <div className="h-64"><ResponsiveContainer>{children}</ResponsiveContainer></div>}</div>
);

export const BarBox = ({ title, data, x = 'name', y = 'score', horizontal }) => (
  <Box title={title} empty={!data?.length}>
    <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 30 : 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
      {horizontal ? <><XAxis type="number" domain={[0, 100]} {...axis} /><YAxis type="category" dataKey={x} width={90} {...axis} /></> : <><XAxis dataKey={x} {...axis} /><YAxis domain={[0, 100]} {...axis} /></>}
      <Tooltip {...tip} /><Bar dataKey={y} fill="#6366f1" radius={4} />
    </BarChart>
  </Box>
);
export const LineBox = ({ title, data, x, y, domain = [0, 100] }) => (
  <Box title={title} empty={!data?.length}>
    <LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} /><XAxis dataKey={x} {...axis} /><YAxis domain={domain} {...axis} />
      <Tooltip {...tip} /><Line type="monotone" dataKey={y} stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
  </Box>
);
export const RadarBox = ({ title, data }) => (
  <Box title={title} empty={!data?.length}>
    <RadarChart data={data}><PolarGrid stroke="#94a3b8" /><PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
      <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} /><Tooltip {...tip} /></RadarChart>
  </Box>
);
