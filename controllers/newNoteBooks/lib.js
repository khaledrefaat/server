exports.updateModelBalance = async model => {
  try {
    const modelArr = await model.find({});

    let previousBalance = 0;
    modelArr.forEach(async model => {
      previousBalance += parseFloat(model.expense);
      model.balance = previousBalance;
      await model.save();
    });
  } catch (err) {
    console.log(err);
    return null;
  }
};

// This function calculates the balance of the DailySales document with the most recent expense.
exports.calcDailySalesBalance = (dailySales, expense) => {
  try {
    if (dailySales.length === 0) return -expense;
    const balance = dailySales[dailySales.length - 1].money.balance;
    return parseFloat(balance) - parseFloat(expense);
  } catch (err) {
    console.log(err);
  }
};

exports.calcDailySalesBalanceIncome = (dailySales, income) => {
  try {
    if (dailySales.length === 0) return income;
    const balance = dailySales[dailySales.length - 1].money.balance;
    return parseFloat(balance) + parseFloat(income);
  } catch (err) {
    console.log(err);
  }
};

exports.calcBalance = (requirementsOldData, expense) => {
  const parseExpense = parseFloat(expense);
  // Check if the requirementsOldData array is empty.
  if (requirementsOldData.length > 0) {
    // Get the balance of the last element in the array.
    const balance = parseFloat(
      requirementsOldData[requirementsOldData.length - 1].balance
    );

    // If the balance is greater than 0, return the balance plus the expense.
    if (typeof balance === 'number') {
      return balance + parseExpense;
    }
  }

  // Otherwise, return the expense amount.
  return parseExpense;
};

exports.calcBalanceIncome = (requirementsOldData, income) => {
  const parseIncome = parseFloat(income);
  // Check if the requirementsOldData array is empty.
  if (requirementsOldData.length > 0) {
    // Get the balance of the last element in the array.
    const balance = parseFloat(
      requirementsOldData[requirementsOldData.length - 1].balance
    );

    // If the balance is greater than 0, return the balance plus the expense.
    if (typeof balance === 'number') {
      return balance - parseIncome;
    }
  }

  // Otherwise, return the expense amount.
  return parseIncome;
};
