const dailyScoreModel = require('../models/dailyScoreModel')

const getUserDailyScore = async(req, res) => {
    console.log(`get request of fetching user daily score`);
    const { userId } = req.user;
    const score_date = req.query?.score_date ?? null;
    const days = req.query?.days ?? null;
    try {
        let getDailyScores;
        if(score_date){
            getDailyScores = await dailyScoreModel.getDailyScoresByDate(userId, score_date);
        }else if(days){
            getDailyScores = await dailyScoreModel.getDailyScoresByDays(userId, days);
        }else{
            return res.status(404).json({error: 'request paramater invalid'});
        }
        return res.status(200).json(getDailyScores);
    } catch (err){
        console.log("get daily score error ", err);
        return res.status(500).json({ error: 'Failed to get daily score'});
    }
}

const uploadUserDailyScore = async(req, res) => {
    console.log(`get request of uploading user daily score`);
    const { userId } = req.user;
    const jsonBody = JSON.parse(req.body);
    const score_date = jsonBody.score_date;
    const mental_health_score = jsonBody.mental_health_score;
    const mental_details = jsonBody.json.mental_details

    if( !score_date || !mental_details || !mental_health_score){
        return res.status(404).josn({ error: 'request body invlid'})
    }

    try {
        const uploadUserDailyScore = await dailyScoreModel.createDailyScore(userId, score_date, mental_health_score, mental_details);
        return res.status(200).json(uploadUserDailyScore);
    } catch (err){
        console.log("upload daily score error ", err);
        return res.status(500).json({ error: 'Failed to get daily score'});
    }
}

module.exports = {
    uploadUserDailyScore,
    getUserDailyScore
}