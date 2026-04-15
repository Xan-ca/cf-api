const axios = require('axios');
const fs = require('fs');

async function generateEnrichedProblemList() {
    try {
        console.log("Fetching contests...");
        const contestRes = await axios.get('https://codeforces.com/api/contest.list');
        
        console.log("Fetching problems...");
        const problemRes = await axios.get('https://codeforces.com/api/problemset.problems');

        // 1. Enhanced Mapping Logic
        const contestMap = {};
        contestRes.data.result.forEach(c => {
            const categories = [];
            const name = c.name;

            // Standard Divisions
            if (/Div\.\s*1/i.test(name)) categories.push("Div. 1");
            if (/Div\.\s*2/i.test(name)) categories.push("Div. 2");
            if (/Div\.\s*3/i.test(name)) categories.push("Div. 3");
            if (/Div\.\s*4/i.test(name)) categories.push("Div. 4");

            // Special & "Weird" Contests
            if (/ICPC|Regional|Training/i.test(name)) categories.push("ICPC");
            if (/Educational/i.test(name)) categories.push("Educational");
            if (/Global/i.test(name)) categories.push("Global");
            if (/Kotlin Heroes/i.test(name)) categories.push("Kotlin Heroes");
            if (/Testing/i.test(name)) categories.push("Testing");
            
            // Sponsored Rounds (TypeDB, Pinely, Nebulas, etc.)
            if (/TypeDB|Pinely|Nebulas|Harbour.Space|Manthan/i.test(name)) categories.push("Sponsored");

            contestMap[c.id] = {
                categories: categories,
                contestName: name
            };
        });

        const rawProblems = problemRes.data.result.problems;
        const rawStats = problemRes.data.result.problemStatistics;

        console.log("Merging data...");

        const enrichedProblems = rawProblems.map((prob, index) => {
            const contestInfo = contestMap[prob.contestId] || { categories: ["Other"], contestName: "Unknown" };
            
            return {
                ...prob,
                categories: contestInfo.categories, // ["Div. 2", "ICPC"] or ["Sponsored"]
                contestName: contestInfo.contestName,
                solvedCount: rawStats[index].solvedCount
            };
        });

        const finalJSON = {
            status: "OK",
            lastUpdated: new Date().toISOString(),
            result: enrichedProblems
        };

        fs.writeFileSync('enriched_problems.json', JSON.stringify(finalJSON, null, 2));
        console.log(`Success! Saved ${enrichedProblems.length} problems with specialized tags.`);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

generateEnrichedProblemList();