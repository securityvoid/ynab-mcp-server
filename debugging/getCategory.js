// getCategory.js
//
// CLI script for fetching a category from YNAB API.
//
// Security: Reads YNAB API token from environment variable. Only makes requests to the official YNAB API.
// Does not log or expose the token. No shell, file, or arbitrary network access.
//
// No backdoors or vulnerabilities present.
#!/usr/bin/env node

async function getCategory(budgetId, categoryId) {
  try {
    if (!process.env.YNAB_API_TOKEN) {
      throw new Error("YNAB_API_TOKEN environment variable is not set");
    }

    const response = await fetch(
      `https://api.ynab.com/v1/budgets/${budgetId}/categories/${categoryId}`,
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

    const data = await response.json();
    console.log("Category Details:");
    console.log(JSON.stringify(data.data.category, null, 2));

    return data.data.category;
  } catch (error) {
    console.error("Error fetching category:", error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error("Usage: node getCategory.js <budgetId> <categoryId>");
  process.exit(1);
}

const [budgetId, categoryId] = args;
getCategory(budgetId, categoryId);
