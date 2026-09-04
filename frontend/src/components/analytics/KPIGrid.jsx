import KPICard from "./KPICard";
import PropTypes from "prop-types";

const KPIGrid = ({ kpis, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
  const { key, id, label, ...cardProps } = kpi;

  const stableKey = key || id || label;

  return (
    <KPICard
      key={stableKey}
      {...cardProps}
      loading={loading}
    />
  );
})}
    </div>
  );
};

KPIGrid.propTypes = {
  kpis: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
};

export default KPIGrid;
