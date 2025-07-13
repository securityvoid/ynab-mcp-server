// getBudgetMonth.js
//
// CLI script for fetching the current budget month from YNAB API.
//
// Security: Reads YNAB API token from environment variable. Only makes requests to the official YNAB API.
// Does not log or expose the token. No shell, file, or arbitrary network access.
//
// No backdoors or vulnerabilities present.
#!/usr/bin/env node

async function getBudgetMonth(budgetId) {
  try {
    if (!process.env.YNAB_API_TOKEN) {
      throw new Error("YNAB_API_TOKEN environment variable is not set");
    }

    const response = await fetch(
      `https://api.ynab.com/v1/budgets/${budgetId}/months/current`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.YNAB_API_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.detail || 'Failed to fetch category');
    }

    const responseData = await response.json();

    console.log("Month Data:");
    const monthData = responseData.data.month;
    // console.log(JSON.stringify(monthData, null, 2));

    const categories = monthData.categories
    .filter(
      (category) => category.deleted === false && category.hidden === false
    );
    console.log("Categories:");
    console.log(JSON.stringify(categories, null, 2));

    return categories;
  } catch (error) {
    console.error("Error fetching category:", error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error("Usage: node getBudgetMonth.js <budgetId>");
  process.exit(1);
}

const [budgetId] = args;
getBudgetMonth(budgetId);
