import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";

import {
  getReadOnlyContract,
  getSignerContract,
} from "../blockchain/contract";

import {
  getMetaMaskProvider,
} from "../blockchain/provider";

import { useWallet } from "../context/WalletContext";


const ROLE_LABELS = {
  0: "NONE",
  1: "ADMIN",
  2: "MANUFACTURER",
  3: "DISTRIBUTOR",
  4: "RETAILER",
  5: "CUSTOMER",
};


// ============================================================
// REAL BLOCKCHAIN BATCH STATUS
// ============================================================

const BATCH_STATUS = {
  0: "ACTIVE",
  1: "SOLD",
  2: "RECALLED",
  3: "IN TRANSIT",
  4: "DELIVERED",
};


function shortenAddress(address) {
  if (!address) {
    return "—";
  }

  return `${address.slice(
    0,
    6
  )}...${address.slice(-4)}`;
}


function formatDate(timestamp) {
  if (!timestamp) {
    return "—";
  }

  return new Date(
    Number(timestamp) * 1000
  ).toLocaleDateString();
}


export default function TransferPage({
  role: roleProp = "manufacturer",
}) {

  // ==========================================================
  // WALLET
  // ==========================================================

  const {
    address,
    role: walletRole,
  } = useWallet();


  const currentRole =
    walletRole?.name ||
    roleProp.toUpperCase();


  const isRetailer =
    currentRole === "RETAILER";


  const isManufacturer =
    currentRole === "MANUFACTURER";


  const isDistributor =
    currentRole === "DISTRIBUTOR";


  // ==========================================================
  // CONTRACT
  // ==========================================================

  const [contract] = useState(
    () => getReadOnlyContract()
  );


  // ==========================================================
  // BLOCKCHAIN DATA
  // ==========================================================

  const [batches, setBatches] =
    useState([]);

  const [organizations, setOrganizations] =
    useState([]);

  const [selectedBatchId, setSelectedBatchId] =
    useState("");

  const [batch, setBatch] =
    useState(null);


  // ==========================================================
  // FORM
  // ==========================================================

  const [selectedRecipient, setSelectedRecipient] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [notes, setNotes] =
    useState("");


  // ==========================================================
  // UI STATE
  // ==========================================================

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD ACTUAL BLOCKCHAIN STATE
  // ==========================================================

  const loadInitialData =
    useCallback(async () => {

      try {

        setLoading(true);

        setError("");


        // ------------------------------------------------------
        // Get current batch IDs + organization IDs
        // ------------------------------------------------------

        const [
          batchIds,
          organizationIds,
        ] = await Promise.all([

          contract.getBatchIds(),

          contract.getOrganizationIds(),

        ]);


        // ------------------------------------------------------
        // Load EVERY batch from blockchain
        // ------------------------------------------------------

        const batchData =
          await Promise.all(

            batchIds.map(
              async (batchId) => {

                const data =
                  await contract.getBatch(
                    batchId
                  );


                // Load product information
                let productName =
                  data.productId;


                try {

                  const product =
                    await contract.getProduct(
                      data.productId
                    );

                  productName =
                    product.name;

                } catch (productError) {

                  console.warn(
                    "Could not load product:",
                    data.productId
                  );

                }


                // Load current owner organization
                let ownerName =
                  shortenAddress(
                    data.currentOwner
                  );


                try {

                  const organizationId =
                    await contract.organizationIdByAddress(
                      data.currentOwner
                    );


                  if (organizationId) {

                    const organization =
                      await contract.getOrganization(
                        organizationId
                      );


                    ownerName =
                      organization.name;

                  }

                } catch (ownerError) {

                  console.warn(
                    "Could not load owner organization:",
                    data.currentOwner
                  );

                }


                return {

                  id:
                    data.batchId,

                  productId:
                    data.productId,

                  product:
                    productName,

                  quantity:
                    data.quantity.toString(),

                  manufacturingDate:
                    formatDate(
                      data.manufacturingDate
                    ),

                  expiryDate:
                    formatDate(
                      data.expiryDate
                    ),

                  mrp:
                    data.mrp.toString(),

                  currentOwner:
                    data.currentOwner,

                  ownerName,

                  status:
                    Number(data.status),

                  statusLabel:
                    BATCH_STATUS[
                      Number(data.status)
                    ] || "UNKNOWN",

                  recalled:
                    data.recalled,

                  recallReason:
                    data.recallReason,

                  createdAt:
                    data.createdAt,

                };

              }
            )

          );


        setBatches(batchData);


        // ------------------------------------------------------
        // Load EVERY organization from blockchain
        // ------------------------------------------------------

        const organizationData =
          await Promise.all(

            organizationIds.map(
              async (organizationId) => {

                const organization =
                  await contract.getOrganization(
                    organizationId
                  );


                return {

                  id:
                    organization.organizationId,

                  name:
                    organization.name,

                  wallet:
                    organization.walletAddress,

                  role:
                    Number(
                      organization.role
                    ),

                  active:
                    organization.active,

                  location:
                    organization.location,

                };

              }
            )

          );


        // ------------------------------------------------------
        // Only active supply-chain participants
        // ------------------------------------------------------

        setOrganizations(

          organizationData.filter(
            (item) =>

              item.active &&

              item.role !== 1 && // ADMIN

              item.role !== 5 && // CUSTOMER

              item.wallet.toLowerCase() !==
                (address || "").toLowerCase()

          )

        );


        // ------------------------------------------------------
        // Select a batch owned by connected wallet
        // ------------------------------------------------------

        if (address) {

          const ownedBatch =
            batchData.find(
              (item) =>

                item.currentOwner.toLowerCase() ===
                address.toLowerCase()

            );


          if (ownedBatch) {

            setSelectedBatchId(
              ownedBatch.id
            );

          } else {

            setSelectedBatchId("");

          }

        } else {

          setSelectedBatchId("");

        }

      } catch (err) {

        console.error(
          "Failed to load transfer data:",
          err
        );


        setError(

          err?.shortMessage ||

          err?.message ||

          "Failed to load blockchain data."

        );

      } finally {

        setLoading(false);

      }

    }, [

      contract,

      address,

    ]);


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadInitialData();

  }, [
    loadInitialData,
  ]);


  // ==========================================================
  // LOAD SELECTED BATCH
  // ==========================================================

  const loadBatch =
    useCallback(

      async (batchId) => {

        if (!batchId) {

          setBatch(null);

          return;

        }


        try {

          setError("");


          const batchData =
            await contract.getBatch(
              batchId
            );


          setBatch(
            batchData
          );


          setSelectedRecipient("");


        } catch (err) {

          console.error(
            "Failed to load batch:",
            err
          );


          setBatch(null);


          setError(

            err?.shortMessage ||

            err?.message ||

            "Failed to load batch."

          );

        }

      },

      [contract]

    );


  useEffect(() => {

    loadBatch(
      selectedBatchId
    );

  }, [

    selectedBatchId,

    loadBatch,

  ]);


  // ==========================================================
  // GET CURRENT BATCH FROM LOCAL BLOCKCHAIN DATA
  // ==========================================================

  const selectedBatch =
    batches.find(
      (item) =>
        item.id ===
        selectedBatchId
    );


  // ==========================================================
  // HANDLE TRANSFER
  // ==========================================================

  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    setMessage("");

    setError("");


    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (!selectedBatchId) {

      setError(
        "Please select a batch."
      );

      return;

    }


    if (!selectedRecipient) {

      setError(
        "Please select a recipient organization."
      );

      return;

    }


    if (!batch) {

      setError(
        "Batch information is not loaded."
      );

      return;

    }


    // --------------------------------------------------------
    // Recalled
    // --------------------------------------------------------

    if (batch.recalled) {

      setError(
        "This batch has been recalled and cannot be transferred."
      );

      return;

    }


    // --------------------------------------------------------
    // Check connected wallet
    // --------------------------------------------------------

    if (!address) {

      setError(
        "Please connect your MetaMask wallet."
      );

      return;

    }


    // --------------------------------------------------------
    // Current owner check
    // --------------------------------------------------------

    if (

      address.toLowerCase() !==

      batch.currentOwner.toLowerCase()

    ) {

      setError(
        "Connected wallet is not the current owner of this batch."
      );

      return;

    }


    // --------------------------------------------------------
    // Don't allow transfer of SOLD batches
    // --------------------------------------------------------

    if (
      Number(batch.status) === 1
    ) {

      setError(
        "This batch has already been sold."
      );

      return;

    }


    try {

      setSubmitting(true);


      // ------------------------------------------------------
      // MetaMask
      // ------------------------------------------------------

      const provider =
        await getMetaMaskProvider();


      const signer =
        await provider.getSigner();


      const signerAddress =
        await signer.getAddress();


      // ------------------------------------------------------
      // Double-check signer
      // ------------------------------------------------------

      if (

        signerAddress.toLowerCase() !==

        batch.currentOwner.toLowerCase()

      ) {

        throw new Error(
          "Connected MetaMask wallet is not the current owner of this batch."
        );

      }


      // ------------------------------------------------------
      // Signer contract
      // ------------------------------------------------------

      const signerContract =
        getSignerContract(
          signer
        );


      // ------------------------------------------------------
      // Submit blockchain transaction
      // ------------------------------------------------------

      const tx =
        await signerContract.transferBatch(

          selectedBatchId,

          selectedRecipient,

          location ||

            "Supply-chain transfer",

          notes ||

            "Batch transferred through FoodTrace"

        );


      setMessage(
        `Transaction submitted: ${tx.hash}`
      );


      // ------------------------------------------------------
      // Wait for blockchain confirmation
      // ------------------------------------------------------

      await tx.wait();


      setMessage(
        `Transfer confirmed successfully. Transaction: ${tx.hash}`
      );


      // ------------------------------------------------------
      // Reload ACTUAL blockchain state
      // ------------------------------------------------------

      await loadInitialData();

      await loadBatch(
        selectedBatchId
      );


      setNotes("");

      setLocation("");

      setSelectedRecipient("");


    } catch (err) {

      console.error(
        "Transfer failed:",
        err
      );


      setError(

        err?.reason ||

        err?.shortMessage ||

        err?.message ||

        "Transfer transaction failed."

      );

    } finally {

      setSubmitting(false);

    }

  }


  // ==========================================================
  // ONLY SHOW BATCHES OWNED BY CURRENT WALLET
  // ==========================================================

  const transferableBatches =
    batches.filter(

      (item) =>

        address &&

        item.currentOwner.toLowerCase() ===

        address.toLowerCase() &&

        !item.recalled &&

        Number(item.status) !== 1

    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <AppShell
      role={
        currentRole.toLowerCase()
      }
    >


      <PageHeader

        eyebrow="SUPPLY CHAIN"

        title={
          isRetailer
            ? "Receive batch"
            : "Transfer batch"
        }

        description={
          isRetailer

            ? "Confirm receipt of an incoming batch through the blockchain."

            : "Transfer the current batch ownership to another authorized participant."
        }

      />


      {/* ======================================================
          SUCCESS
          ====================================================== */}

      {message && (

        <div
          className="panel"
          style={{
            marginBottom: 20,
          }}
        >

          <p>
            ✓ {message}
          </p>

        </div>

      )}


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (

        <div
          className="panel"
          style={{
            marginBottom: 20,
          }}
        >

          <p
            style={{
              color: "#dc2626",
            }}
          >
            {error}
          </p>

        </div>

      )}


      {loading ? (

        <section className="panel">

          <p>
            Loading current blockchain data...
          </p>

        </section>

      ) : (

        <div className="form-layout">


          {/* ==================================================
              FORM
              ================================================== */}

          <section className="panel form-panel">


            <div className="panel-header">

              <div>

                <h2>

                  {isRetailer
                    ? "Receive shipment"
                    : "New ownership transfer"}

                </h2>

                <p>

                  This action will create a
                  real blockchain transaction.

                </p>

              </div>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >


              {/* ==============================================
                  BATCH
                  ============================================== */}

              <label>
                Batch
              </label>


              <select

                value={
                  selectedBatchId
                }

                onChange={(event) =>
                  setSelectedBatchId(
                    event.target.value
                  )
                }

                disabled={
                  submitting
                }

              >

                <option value="">
                  Select batch
                </option>


                {transferableBatches.map(
                  (item) => (

                    <option
                      key={item.id}
                      value={item.id}
                    >

                      {item.id}
                      {" — "}
                      {item.product}
                      {" — "}
                      {item.statusLabel}

                    </option>

                  )
                )}

              </select>


              {/* ==============================================
                  NO OWNED BATCHES
                  ============================================== */}

              {address &&
                transferableBatches.length === 0 && (

                  <p
                    className="muted"
                    style={{
                      marginTop: 8,
                    }}
                  >

                    No transferable batches are
                    currently owned by this wallet.

                  </p>

                )}


              {/* ==============================================
                  CURRENT BATCH INFORMATION
                  ============================================== */}

              {selectedBatch && (

                <>

                  <label>
                    Product
                  </label>

                  <input
                    value={
                      selectedBatch.product
                    }
                    readOnly
                  />


                  <label>
                    Batch quantity
                  </label>

                  <input
                    value={`${Number(
                      selectedBatch.quantity
                    ).toLocaleString()} units`}
                    readOnly
                  />


                  <label>
                    MRP
                  </label>

                  <input
                    value={`₹${Number(
                      selectedBatch.mrp
                    ).toLocaleString()}`}
                    readOnly
                  />


                  <label>
                    Current owner
                  </label>

                  <input
                    value={
                      selectedBatch.ownerName
                    }
                    readOnly
                  />


                  <label>
                    Owner wallet
                  </label>

                  <input
                    value={
                      shortenAddress(
                        selectedBatch.currentOwner
                      )
                    }
                    readOnly
                  />


                  <label>
                    Manufacturing date
                  </label>

                  <input
                    value={
                      selectedBatch.manufacturingDate
                    }
                    readOnly
                  />


                  <label>
                    Expiry date
                  </label>

                  <input
                    value={
                      selectedBatch.expiryDate
                    }
                    readOnly
                  />


                  {/* ==========================================
                      ACTUAL STATUS
                      ========================================== */}

                  <label>
                    Current status
                  </label>

                  <input
                    value={
                      selectedBatch.statusLabel
                    }
                    readOnly
                  />


                  {selectedBatch.recalled && (

                    <div
                      style={{
                        marginTop: 8,
                        padding: 12,
                        border:
                          "1px solid #fecaca",
                        background:
                          "#fef2f2",
                        color:
                          "#b91c1c",
                        borderRadius: 8,
                      }}
                    >

                      <strong>
                        Batch recalled
                      </strong>

                      <div>
                        {
                          selectedBatch.recallReason
                        }
                      </div>

                    </div>

                  )}

                </>

              )}


              {/* ==============================================
                  RECIPIENT
                  ============================================== */}

              <label>
                Recipient organization
              </label>


              <select

                value={
                  selectedRecipient
                }

                onChange={(event) =>
                  setSelectedRecipient(
                    event.target.value
                  )
                }

                disabled={
                  submitting ||
                  !selectedBatch
                }

              >

                <option value="">
                  Select recipient
                </option>


                {organizations.map(
                  (organization) => (

                    <option
                      key={
                        organization.id
                      }
                      value={
                        organization.wallet
                      }
                    >

                      {organization.name}
                      {" — "}
                      {
                        ROLE_LABELS[
                          organization.role
                        ]
                      }

                    </option>

                  )
                )}

              </select>


              {/* ==============================================
                  LOCATION
                  ============================================== */}

              <label>
                Location
              </label>


              <input

                value={
                  location
                }

                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }

                placeholder="e.g. Pune"

                disabled={
                  submitting
                }

              />


              {/* ==============================================
                  NOTES
                  ============================================== */}

              <label>
                Notes
              </label>


              <textarea

                value={
                  notes
                }

                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }

                placeholder="Optional transfer notes..."

                rows={4}

                disabled={
                  submitting
                }

              />


              {/* ==============================================
                  ACTIONS
                  ============================================== */}

              <div className="form-actions">


                <Link
                  className="button button-secondary"
                  to="/app/batches"
                >

                  Cancel

                </Link>


                <button

                  className="button button-primary"

                  type="submit"

                  disabled={

                    submitting ||

                    !selectedBatchId ||

                    !selectedRecipient ||

                    !batch ||

                    batch.recalled ||

                    Number(batch.status) === 1

                  }

                >

                  {submitting

                    ? "Confirming..."

                    : isRetailer

                    ? "Confirm receipt"

                    : "Transfer batch"}

                </button>


              </div>


            </form>


          </section>


          {/* ==================================================
              INFORMATION PANEL
              ================================================== */}

          {/* <aside className="panel info-panel">


            <span className="feature-icon">
              →
            </span>


            <h2>
              Smart-contract rules
            </h2>


            <p>
              FoodTrace enforces ownership,
              authorization and batch state
              directly in Solidity.
            </p>


            <div className="rule-box">

              <code>
                msg.sender == currentOwner
              </code>

              <span>
                Required
              </span>

            </div>


            <div className="rule-box">

              <code>
                newOwner != address(0)
              </code>

              <span>
                Required
              </span>

            </div>


            <div className="rule-box">

              <code>
                newOwner is authorized
              </code>

              <span>
                Required
              </span>

            </div>


            <div className="rule-box">

              <code>
                batch.recalled == false
              </code>

              <span>
                Required
              </span>

            </div>

            <div
              style={{
                marginTop: 24,
              }}
            >

              <h3>
                Batch states
              </h3>


              <div className="rule-box">

                <code>
                  0
                </code>

                <span>
                  ACTIVE
                </span>

              </div>


              <div className="rule-box">

                <code>
                  1
                </code>

                <span>
                  SOLD
                </span>

              </div>


              <div className="rule-box">

                <code>
                  2
                </code>

                <span>
                  RECALLED
                </span>

              </div>


              <div className="rule-box">

                <code>
                  3
                </code>

                <span>
                  IN TRANSIT
                </span>

              </div>


              <div className="rule-box">

                <code>
                  4
                </code>

                <span>
                  DELIVERED
                </span>

              </div>

            </div>


          </aside> */}


        </div>

      )}

    </AppShell>

  );

}