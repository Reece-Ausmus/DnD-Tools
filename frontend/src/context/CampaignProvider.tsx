import { useState } from "react";
import CampaignContext from "./CampaignContext";
import { Campaign, Invite } from "@/util/types";

const CampaignProvider = ({ children }: { children: React.ReactNode }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const response = await fetch("/api/campaign/get_campaigns", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to get campaigns");

      setCampaigns(data.campaigns);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      setInvitesLoading(true);
      const response = await fetch("/api/campaign/get_invites", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      setInvites(data.invites);

      if (!response.ok)
        throw new Error(data.message || "Failed to get invites");
    } catch (err: any) {
      console.error(err);
    } finally {
      setInvitesLoading(false);
    }
  };

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        fetchCampaigns,
        campaignsLoading,
        invites,
        fetchInvites,
        invitesLoading,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export default CampaignProvider;
