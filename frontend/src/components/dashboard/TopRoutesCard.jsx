const TopRoutesCard = ({ data }) => {
    return (
        <div className="bg-white rounded-xl shadow border p-5">

            <h2 className="text-xl font-bold text-black mb-5">
                Top Routes
            </h2>

            {data.length === 0 ? (

                <p>No data available.</p>

            ) : (

                data.map((route, index) => (

                    <div
                        key={route._id}
                        className="text-black flex justify-between border-b py-2"
                    >
                        <span>
                            {index + 1}. {route._id}
                        </span>

                        <span className="font-semibold text-blue-600">
                            ₱ {route.revenue.toLocaleString()}
                        </span>

                    </div>

                ))

            )}

        </div>
    );
};

export default TopRoutesCard;