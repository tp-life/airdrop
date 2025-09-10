import path from "path";
import { EXTENDS } from ".";

const extendsPath = EXTENDS;

export const metamask = path.join(
  extendsPath,
  "nkbihfbeogaeaoehlefnkodbefgpgknn",
  "12.12.0_0",
);
export const okx = path.join(
  extendsPath,
  "mcohilncbfahbmgdjkbpemcciiolgcge",
  "3.38.20_0",
);
export const phantom = path.join(
  extendsPath,
  "bfnaelmomeimhlpmgjnjophhpkkoljpa",
  "25.15.0_0",
);
export const yesCaptcha = path.join(
  extendsPath,
  "jiofmdifioeejeilfkpegipdjiopiekl",
  "1.1.62_0",
);

export const keplr = path.join(
  extendsPath,
  "dmkamcknogkgcdfhhbddcghachkejeap",
  "0.12.250_0",
);

export const captchaSolver = path.join(
  extendsPath,
  "pgojnojmmhpofjgdmaebadhbocahppod",
  "1.15.2_0",
);

export const walletExtList: string[] = [metamask, okx, phantom, keplr];
