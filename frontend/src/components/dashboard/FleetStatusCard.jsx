const FleetStatusCard = ({ data }) => {
  const getColor = (status) => {
    switch (status) {
      case "Available":
        return "text-green-600";

      case "On Route":
        return "text-blue-600";

      case "Under Maintenance":
        return "text-orange-600";

      case "Inactive":
        return "text-red-600";

      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow border p-5">

      <h2 className="text-xl font-bold text-black mb-5">
        Fleet Status (Units) 
      </h2>

      {data.length === 0 ? (

        <p>No data available.</p>

      ) : (

        data.map((item) => (

          <div
            key={item._id}
            className="text-black flex justify-between border-b py-2"
          >
            <span>{item._id}</span>

            <span className={`font-bold ${getColor(item._id)}`}>
              {item.count}
            </span>

          </div>

        ))

      )}

    </div>
  );
};

export default FleetStatusCard;