const TopDriversCard = ({ data }) => {
    return (
        <div className="bg-white rounded-xl shadow border p-5">

            <h2 className="text-xl font-bold text-black mb-5">
                Top Drivers
            </h2>

            {data.length === 0 ? (

                <p>No data available.</p>

            ) : (

                data.map((driver, index) => (

                    <div
                        key={driver._id}
                        className="text-black flex justify-between border-b py-2"
                    >
                        <span>
                            {index + 1}. {driver.name}
                        </span>

                        <span className="font-semibold text-green-600">
                            ₱ {driver.totalRevenue.toLocaleString()}
                        </span>

                    </div>

                ))

            )}

        </div>
    );
};

export default TopDriversCard;