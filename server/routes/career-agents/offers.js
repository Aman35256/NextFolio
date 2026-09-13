import express from 'express';
import { OfferRecord, CandidateProfile } from '../../models/index.js';
import orchestrator from '../../agents/AgentOrchestrator.js';

const router = express.Router();

/**
 * GET /api/career-agents/offers
 * Get all offer evaluations for the user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const offers = await OfferRecord.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, offers });
  } catch (error) {
    console.error('Fetch offers error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/career-agents/offers/analyze
 * Analyze a new job offer and save calculation
 */
router.post('/analyze', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const offerData = req.body;
    const profile = await CandidateProfile.findOne({ where: { userId } });
    if (!profile) {
      return res.status(400).json({ error: 'Candidate profile required. Please analyze resume first.' });
    }

    // Call OfferAgent to evaluate
    const offerAgent = orchestrator.getAgent('offer');
    const analysis = await offerAgent.run({ offerData, profile });

    // Create the Offer Record
    const offer = await OfferRecord.create({
      userId,
      company: offerData.company,
      role: offerData.role,
      salary: offerData.salary,
      equity: offerData.equity || 'None',
      benefits: offerData.benefits || {},
      bonuses: offerData.bonuses || 'None',
      location: offerData.location,
      offerScore: analysis.offerScore,
      pros: analysis.pros,
      cons: analysis.cons,
      negotiationSuggestions: analysis.negotiationSuggestions,
      marketComparison: analysis.marketComparison,
      status: 'pending',
    });

    // Notify user
    orchestrator.eventBus.publish('notification.dispatch', {
      userId,
      type: 'offer_evaluation',
      message: `Offer evaluation score calculated: ${analysis.offerScore}/100 for ${offerData.company}. Click to view details and scripts.`,
    });

    res.json({
      success: true,
      offer,
      message: 'Offer analyzed successfully.',
    });
  } catch (error) {
    console.error('Analyze offer error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/career-agents/offers/:id
 * Update status of an evaluated offer
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const offerId = req.params.id;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const offer = await OfferRecord.findOne({ where: { id: offerId, userId } });
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    await offer.update({ status });

    res.json({
      success: true,
      offer,
      message: `Offer status updated to ${status}`,
    });
  } catch (error) {
    console.error('Update offer status error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
