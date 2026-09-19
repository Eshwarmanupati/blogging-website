import axios from "axios";

/*
    Merges a freshly fetched page into the existing list and asks the server for
    the matching total, so "Load more" knows when to stop. `create_new_arr` is set
    when the underlying query changed (new tab, new search) and the old results
    should be thrown away rather than appended to.
*/
export const filterPaginationData = async ({
    create_new_arr = false,
    state,
    data,
    page,
    countRoute,
    data_to_send = {},
    user = undefined
}) => {
    if (!create_new_arr && state !== null) {
        return { ...state, results: [...state.results, ...data], page };
    }

    const headers = user ? { headers: { Authorization: `Bearer ${user}` } } : {};

    try {
        const { data: { totalDocs } } = await axios.post(
            import.meta.env.VITE_SERVER_DOMAIN + countRoute,
            data_to_send,
            headers
        );

        return { results: data, page: 1, totalDocs };
    } catch (err) {
        console.error(err);
        return { results: data, page: 1, totalDocs: data.length };
    }
};

export default filterPaginationData;
