const Friends = require('../models/friendModel');

const meId = (req)=> req.user?.user_id || req.user?.uid;

exports.sendRequest = async (req,res)=>{
  try{
    const me = meId(req); if(!me) return res.status(401).json({error:'unauthorised'});
    const { toUserId } = req.body||{};
    if(!toUserId) return res.status(400).json({error:'toUserId required'});
    if(String(me)===String(toUserId)) return res.status(400).json({error:'cannot add yourself'});
    const r = await Friends.sendFriendRequest(me, toUserId);
    if(!r) return res.status(409).json({error:'request already exists'});
    res.status(201).json(r);
  }catch(e){ res.status(500).json({error:'server error'}); }
};

exports.listRequests = async (req,res)=>{
  try{ 
    const me = meId(req);
    if(!me) return res.status(401).json({error:'unauthorised'});
    const items = await Friends.listRequests(me, (req.query.type||'incoming'));
    res.json(items);
  }catch(e){ res.status(500).json({error:'server error'}); }
};

exports.accept = async (req,res)=>{
  try{ 
    const me = meId(req);
    if(!me) return res.status(401).json({error:'unauthorised'});
    const targetId = req.params.userId || req.params.id;
    if(!targetId) return res.status(400).json({error:'cannot accept'});
    try {
      const ok = await Friends.acceptRequest(targetId, me);
      res.json(ok);
    } catch(e) {
      if(e.message === 'not_found_or_forbidden') {
        res.status(404).json({error:'not found'});
      } else {
        res.status(400).json({error:'cannot accept'});
      }
    }
  }catch(e){ res.status(400).json({error:'cannot accept'}); }
};

exports.decline = async (req,res)=>{
  try{ 
    const me = meId(req); 
    if(!me) return res.status(401).json({error:'unauthorised'});
    const targetId = req.params.userId || req.params.id;
    if(!targetId) return res.status(404).json({error:'not found'});
    const r = await Friends.declineRequest(targetId, me);
    if(!r) return res.status(404).json({error:'not found'});
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:'server error'}); }
};

exports.cancel = async (req,res)=>{
  try{ 
    const me = meId(req); 
    if(!me) return res.status(401).json({error:'unauthorised'});
    const targetId = req.params.userId || req.params.id;
    if(!targetId) return res.status(404).json({error:'not found'});
    const r = await Friends.cancelRequest(me, targetId);
    if(!r) return res.status(404).json({error:'not found'});
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:'server error'}); }
};

exports.listFriends = async (req,res)=>{
  try{ 
    const me = meId(req);
    if(!me) return res.status(401).json({error:'unauthorised'});
    const rows = await Friends.listFriends(me);
    res.json(rows);
  }catch(e){ res.status(500).json({error:'server error'}); }
};

exports.remove = async (req,res)=>{
  try{ 
    const me = meId(req); 
    if(!me) return res.status(401).json({error:'unauthorised'});
    const { userId } = req.params;
    const r = await Friends.removeFriend(me, userId);
    if(!r || !r.removed) return res.status(404).json({error:'not friends'});
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:'server error'}); }
};