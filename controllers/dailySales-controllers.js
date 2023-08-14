const { removeDuplicates, sendResponse, reverseArr } = require('../lib/lib');
const { retrieveDailySales } = require('../lib/retrieveModelData');

exports.getDailySales = async (req, res, next) => {
  let dailySales = await retrieveDailySales();

  try {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    let years = dailySales.map(dailySale =>
      new Date(dailySale.date).getFullYear()
    );
    years = removeDuplicates(years);

    let organizedDailySales = {};
    // sending data as filtered as years and months
    years.forEach(year => {
      dailySales.forEach(dailySale => {
        const dailySaleDate = new Date(dailySale.date);

        if (dailySaleDate.getFullYear() === year) {
          if (!organizedDailySales[year]) organizedDailySales[year] = {};

          if (organizedDailySales[year][monthNames[dailySaleDate.getMonth()]]) {
            organizedDailySales[year][
              monthNames[dailySaleDate.getMonth()]
            ].push(dailySale);
          } else {
            organizedDailySales[year][monthNames[dailySaleDate.getMonth()]] =
              [];
            organizedDailySales[year][
              monthNames[dailySaleDate.getMonth()]
            ].push(dailySale);
          }
        }
      });
    });
    dailySales = reverseArr(dailySales);

    console.log(organizedDailySales);

    sendResponse(res, { organizedDailySales, dailySales }, 200);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'حدث خطأ ما برجاء المحاولة في وقت لاحق' });
  }
};

exports.postDailySales = async () => {};

exports.deleteDailySales = async () => {};
