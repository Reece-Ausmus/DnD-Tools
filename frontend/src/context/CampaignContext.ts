import { createContext } from "react";
import { Campaign, Invite } from "@/util/types";

interface CampaignContextType {
  campaigns: Campaign[];
  fetchCampaigns: () => Promise<void>;
  campaignsLoading: boolean;
  invites: Invite[];
  fetchInvites: () => Promise<void>;
  invitesLoading: boolean;
}

const CampaignContext = createContext<CampaignContextType | null>(null);

export default CampaignContext;
