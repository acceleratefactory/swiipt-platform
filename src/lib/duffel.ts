const DUFFEL_BASE_URL = "https://api.duffel.com";

async function duffelRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${DUFFEL_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${process.env.DUFFEL_API_KEY}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.errors?.[0]?.message || "Duffel API error");
  }

  return response.json();
}

export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
}) {
  const slices = [
    {
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departureDate,
    },
  ];

  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
    });
  }

  const passengers = [
    ...Array(params.adults).fill({ type: "adult" }),
    ...Array(params.children || 0).fill({ type: "child" }),
    ...Array(params.infants || 0).fill({ type: "infant_without_seat" }),
  ];

  const body = {
    data: {
      slices,
      passengers,
      cabin_class: params.cabinClass,
    },
  };

  const result = await duffelRequest("/air/offer_requests", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return result.data;
}

export async function getOffers(offerRequestId: string, sortBy: "total_amount" | "total_duration" = "total_amount") {
  const result = await duffelRequest(
    `/air/offers?offer_request_id=${offerRequestId}&sort=${sortBy}&limit=20`
  );
  return result.data;
}

export async function getOffer(offerId: string) {
  const result = await duffelRequest(`/air/offers/${offerId}`);
  return result.data;
}

export async function createOrder(params: {
  offerId: string;
  passengers: Array<{
    id: string;
    title: string;
    given_name: string;
    family_name: string;
    born_on: string;
    email: string;
    phone_number: string;
    gender: "m" | "f";
    type: "adult" | "child" | "infant_without_seat";
  }>;
  paymentType: "balance";
  currency: string;
  amount: string;
}) {
  const body = {
    data: {
      type: "instant",
      selected_offers: [params.offerId],
      passengers: params.passengers,
      payments: [
        {
          type: params.paymentType,
          currency: params.currency,
          amount: params.amount,
        },
      ],
    },
  };

  const result = await duffelRequest("/air/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return result.data;
}

export async function searchPlaces(query: string) {
  const result = await duffelRequest(
    `/places/suggestions?query=${encodeURIComponent(query)}&limit=8`
  );
  return result.data;
}
