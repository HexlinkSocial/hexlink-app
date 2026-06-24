import React, { JSX, useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useAuth } from "../hooks/useAuth";
import Table from "../components/table/Table";
import ApprovalRow from "../components/table/Approval/ApprovalRow";
import Banner from "../components/Banner";
import {
  ApprovalItem,
  ApprovalAction,
  fetchApprovals,
  submitAction,
} from "../helpers/approvalsApiHelpers";

interface TableStateProps {
  message: string;
  isError?: boolean;
}

function TableLoadingState(): JSX.Element {
  return (
    <div className="table-container">
      <div
        className="communities-card__spinner"
        style={{ margin: "100px auto" }}
      />
    </div>
  );
}

function TableEmptyState({
  message,
  isError = false,
}: TableStateProps): JSX.Element {
  const className = `communities-card__state${isError ? " communities-card__state--error" : ""}`;
  return (
    <div className="table-container">
      <div className={className}>{message}</div>
    </div>
  );
}

export default function AdminApprovals(): JSX.Element {
  const { signOut } = useAuthenticator();
  const { isAdmin, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [amendTrackId, setAmendTrackId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>("");

  const loadApprovals = useCallback(async (): Promise<void> => {
    try {
      setApiError(null);
      const data = await fetchApprovals();
      setApprovals(data);
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
      setApiError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (isLoggedIn && isAdmin) {
      void loadApprovals();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, isAdmin, isAuthLoading, loadApprovals]);

  const toggleAmend = (id: string): void => {
    setAmendTrackId((prev) => (prev === id ? null : id));
    setCommentText("");
  };

  const handleAction = async (
    id: string,
    action: ApprovalAction,
    comments?: string,
  ): Promise<void> => {
    try {
      await submitAction(id, action, comments);
      setAmendTrackId(null);
      setCommentText("");
      await loadApprovals();
    } catch (error) {
      console.error(`Failed to execute '${action}':`, error);
      setApiError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  if (isAuthLoading || loading) {
    return <TableLoadingState />;
  }

  if (!isLoggedIn || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="table-container">
      <div className="table-header-row">
        <h1 className="table-header-row__title">Approvals</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link to="/" className="btn btn--primary">
            Home
          </Link>
          <button className="btn btn--primary" onClick={signOut}>
            Log out
          </button>
        </div>
      </div>
      <Banner message={apiError} onClose={() => setApiError(null)} />
      {approvals.length === 0 || apiError != null ? (
        <TableEmptyState message="No pending approvals found." />
      ) : (
        <Table>
          {approvals.map((item) => (
            <ApprovalRow
              key={item.id}
              item={item}
              isAmending={amendTrackId === item.id}
              commentText={commentText}
              onCommentChange={setCommentText}
              onApprove={() => handleAction(item.id, "approve")}
              onReject={() => handleAction(item.id, "reject")}
              onToggleAmend={() => toggleAmend(item.id)}
              onSubmitAmend={() => handleAction(item.id, "amend", commentText)}
            />
          ))}
        </Table>
      )}
    </div>
  );
}
