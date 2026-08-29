-- Development-only accounts. Password for every account: Test@12345
-- Do not use these credentials in production.
INSERT INTO users (id, name, email, password, role, memberId, joinDate, status)
VALUES
('00000000-0000-4000-8000-000000000001','Test President','president@cooperatives.test','$2b$12$34KOHiMM7LzsYnvq0xg9yeCGaubmSx1m0ErebwtSac9gKbmcponqq','PRESIDENT','MB-0001',CURRENT_DATE,'Active'),
('00000000-0000-4000-8000-000000000002','Test Assistant President','assistant@cooperatives.test','$2b$12$1qEVxY7Bai9PrN4OanrfnurOG6i1V0jV0m792IzcqHwZxkNcAg1gO','ASSISTANT_PRESIDENT','MB-0002',CURRENT_DATE,'Active'),
('00000000-0000-4000-8000-000000000003','Test Secretary General','secretary@cooperatives.test','$2b$12$4SUlpyqJHJiNL6Qis4ZH7OgLmdLkONp.aJ24TMNfvn1At3jVF/gzK','SECRETARY_GENERAL','MB-0003',CURRENT_DATE,'Active'),
('00000000-0000-4000-8000-000000000004','Test Treasurer','treasurer@cooperatives.test','$2b$12$fp8rDdj78yxIBrbNTAq02e6vbCmkqFuCZXAjsqeXchAwSNbp.gw9m','TREASURER','MB-0004',CURRENT_DATE,'Active'),
('00000000-0000-4000-8000-000000000005','Test Auditor','auditor@cooperatives.test','$2b$12$gNoon.RU6oL6z4.Z1.mF0Os65xWIP8I5D3tx.tDbMrR0Btj2lgmSC','AUDITOR','MB-0005',CURRENT_DATE,'Active'),
('00000000-0000-4000-8000-000000000006','Test Member','member@cooperatives.test','$2b$12$/99NusmU871BkZz5wKUdIOu/3UcA2cXCxVfSTM.JihdZnZCBn7xK.','MEMBER','MB-0006',CURRENT_DATE,'Active')
ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), role=VALUES(role), status='Active';
