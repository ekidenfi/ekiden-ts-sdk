export interface PortfolioResponse {
  user_addr: string;
  positions: PortfolioPosition[];
  vault_balances: PortfolioVault[];
  summary: PortfolioSummary;
}

export interface PortfolioPosition {
  sid: string;
  market_addr: string;
  size: number;
  price: number;
  margin: number;
  funding_index: number;
  epoch: number;
  seq: number;
  timestamp: number;
}

export interface PortfolioVault {
  id: number;
  asset_addr: string;
  balance: number;
}

export interface PortfolioSummary {
  total_positions: number;
  total_vaults: number;
  total_balance: number;
  total_margin_used: number;
  total_available_balance: number;
  collateral_notional?: number;
  maintenance_margin_required?: number;
  unrealized_pnl_total?: number;
  unrealized_funding_total?: number;
}

export interface UserLeverageParams {
  market_addr: string;
  leverage: number;
}
