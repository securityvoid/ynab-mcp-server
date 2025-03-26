#!/usr/bin/env node

async function getAllCategories(budgetId) {
  try {
    if (!process.env.YNAB_API_TOKEN) {
      throw new Error("YNAB_API_TOKEN environment variable is not set");
    }

    const response = await fetch(
      `https://api.ynab.com/v1/budgets/${budgetId}/categories`,
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
    const categoryGroups = responseData.data.category_groups
    // .filter((category_group) => category_group.name !== "Internal Master Category")
    .map((group) => group.categories)
    .flat()
    .filter(
      (category) => category.deleted === false && category.hidden === false
    );
    console.log("Category Groups:");
    console.log(JSON.stringify(categoryGroups, null, 2));

    return categoryGroups;
  } catch (error) {
    console.error("Error fetching category:", error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error("Usage: node getAllCategories.js <budgetId>");
  process.exit(1);
}

const [budgetId] = args;
getAllCategories(budgetId);
