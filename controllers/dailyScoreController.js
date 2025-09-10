const dailyScoreModel = require('../models/dailyScoreModel')

const getUserDailyScore = async(req, res) => {
    console.log(`get request upload user daily score`);
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

}

module.exports = {
    uploadUserDailyScore,
    getUserDailyScore
}